import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faEllipsisV,
  faSearch,
  faFileAlt,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import "../style/Shelf.scss";
import anonymous from "../img/anonymous.png";
import user from "../img/user.png";
import { set, get } from "idb-keyval";

const Shelf = (props) => {
  const [userProfile, setUserProfile] = useState({
    userEmail: "",
    photoUrl: "",
    userName: "",
  });

  const getUserProfile = useCallback(async () => {
    try {
      if (props.tryItNow) {
        setUserProfile({
          userEmail: "anonymous.bunny@gmail.com",
          photoUrl: anonymous,
          userName: "Anonymous Bunny",
        });
      } else {
        if (props.gapi) {
          const profile = props.gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .getBasicProfile();
          const userEmail = profile.getEmail();
          const userName = profile.getName();

          setUserProfile({
            userEmail,
            photoUrl: profile.getImageUrl(),
            userName,
          });

          await set("userEmail", userEmail);
          await set("userName", userName);
        } else {
          const userEmail = await get("userEmail");
          const userName = await get("userName");

          setUserProfile({
            userEmail,
            userName,
            photoUrl: user,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [props.gapi, props.tryItNow]);

  useEffect(() => {
    getUserProfile();
  }, [getUserProfile]);

  const { userEmail, photoUrl, userName } = userProfile;

  return props.showShelf ? (
    <div className="m2-shelf">
      <div className="m2-profile">
        <div className="m2-profile-photo">
          <img src={photoUrl} alt="profile" />
        </div>
        <div className="m2-username">{userName}</div>
        <div className="m2-email">{userEmail}</div>
        <div className="m2-switch-user">
          <button
            className="button is-clear"
            onClick={props.handleSwitchUser}
            disabled={props.offlineMode}
          >
            Switch user
          </button>
          <button
            className="button is-clear"
            onClick={props.handleLogout}
            disabled={props.offlineMode}
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="m2-menu-links">
        <div>
          <a onClick={props.showSearch}>
            <FontAwesomeIcon icon={faSearch} />
            &nbsp;&nbsp;Search
          </a>
        </div>
        <div>
          <a onClick={() => props.showDocs(true)}>
            <FontAwesomeIcon icon={faFileAlt} />
            &nbsp;&nbsp;Docs
          </a>
        </div>
        <div>
          <a onClick={props.showSettings}>
            <FontAwesomeIcon icon={faCog} />
            &nbsp;&nbsp;Settings
          </a>
        </div>
      </div>
      <div className="m2-menu-footer">
        <a onClick={props.showHelp}>Help</a>
        <a onClick={props.showAbout}>About</a>
      </div>
      <a className="m2-close" onClick={() => props.setShelf(false)}>
        <FontAwesomeIcon icon={faTimes} />
      </a>
    </div>
  ) : (
    <div className="m2-menu">
      <a className="m2-ellipsis" onClick={() => props.setShelf(true)}>
        <FontAwesomeIcon icon={faEllipsisV} />
      </a>
    </div>
  );
};

export default Shelf;
