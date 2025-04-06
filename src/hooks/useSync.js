import { useCallback, useRef } from "react";
import syncUtils from "../syncUtils/syncUtils";
import syncUtilsOffline from "../syncUtils/syncUtilsOffline";

export default function useSync(gapi, tryItNow, appDataKey, setState) {
  const syncingRef = useRef(false);
  const syncUtilsRef = useRef(null);

  const initSync = (offlineMode) => {
    syncUtilsRef.current = offlineMode ? syncUtilsOffline() : syncUtils(gapi);
  };

  const sync = useCallback(
    (appData, additionalState) => {
      if (!syncingRef.current) {
        console.log(`starting sync: ${JSON.stringify(appData)}`);
        syncingRef.current = true;
        setState((prev) => ({
          ...prev,
          ...appData,
          ...additionalState,
          appData,
        }));
        return new Promise((resolve) => {
          if (!tryItNow) {
            syncUtilsRef.current
              .syncByRevision(appDataKey, appData)
              .then((newAppData) => {
                console.log(`finished sync: ${JSON.stringify(newAppData)}`);
                setState((prev) => ({
                  ...prev,
                  ...newAppData,
                  appData: newAppData,
                }));
                syncingRef.current = false;
                resolve();
              });
          } else {
            syncingRef.current = false;
            resolve();
          }
        });
      } else {
        return new Promise((resolve) => {
          setTimeout(() => {
            sync(appData, additionalState).then(resolve);
          }, 200);
        });
      }
    },
    [tryItNow, appDataKey, setState]
  );

  return { initSync, sync, syncUtilsRef };
}
