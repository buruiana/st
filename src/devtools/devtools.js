(function () {
    chrome.devtools.panels.create("Saga Timeline",
        "",
        "panel.html",
        function (panel) {
            console.log("Panel created");
        }
    )
})();