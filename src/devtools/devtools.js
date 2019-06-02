(function () {
    chrome.devtools.panels.create("SagaTimeline",
        "",
        "panel.html",
        function (panel) {
            console.log("Panel created");
        }
    )
})();