import marked from "marked";

export function performSearch(searchString, allLines, doc) {
  let searchResults;
  if (!searchString) {
    searchResults = allLines
      .filter((id) => doc[id].startsWith("// "))
      .map((id) => ({ id, html: doc[id].replace("// ", "") }))
      .slice(0, 1000);
  } else if (/^#todo$/i.test(searchString)) {
    const searchRegex = /(?:[-*+]|(?:[0-9]+\.))\s+\[\s\]\s/;
    searchResults = allLines
      .filter((id) => searchRegex.test(doc[id]))
      .map((id) => ({
        id,
        html: marked(doc[id]).replace(searchRegex, (m) => `<mark>${m}</mark>`),
      }))
      .slice(0, 1000);
  } else {
    const exactMatchRegex = /^"(.+)"$/;
    let searchRegex;
    if (exactMatchRegex.test(searchString)) {
      searchRegex = new RegExp(
        searchString
          .match(exactMatchRegex)[1]
          .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
        "ig"
      );
    } else {
      const keywords = searchString
        .split(" ")
        .map((t) => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
      searchRegex = new RegExp(keywords.join("|"), "ig");
    }
    searchResults = allLines
      .filter((id) => searchRegex.test(doc[id]))
      .map((id) => ({
        id,
        html: marked(doc[id]).replace(searchRegex, (m) => `<mark>${m}</mark>`),
      }))
      .slice(0, 1000);
  }
  return searchResults;
}
