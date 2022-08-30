const MAX_HISTORY_LENGTH = 10;

async function readTabsStore() {
    const result = await chrome.storage.local.get(['tabs']);

    return result.tabs || [];
}

async function saveTabStore(tabs) {
    await chrome.storage.local.set({tabs});
}

async function switchTabs() {
    let queryOptions = {};
    let allTabs = await chrome.tabs.query(queryOptions);

    if (allTabs.length <= 1) {
        return;
    }

    const storedTabs = await readTabsStore();
    const tabHistory = storedTabs.filter(storedTabId => allTabs.find(realTab => realTab.id === storedTabId)); // filter out dead tabs from the store

    const activeTab = allTabs.find(tab => tab.active);
    const activeTabId = activeTab.id;
    let prevTabId = tabHistory.find(tabId => tabId !== activeTabId);

    if (!prevTabId) {
        const prevTab = allTabs[activeTab.index + 1] || allTabs[activeTab.index - 1];
        prevTabId = prevTab.id;
    }

    await chrome.tabs.update(prevTabId, {active: true});
}

// set keyboard listeners
chrome.commands.onCommand.addListener(async (command) => {
    switch (command) {
        case 'switch':
            await switchTabs();
            break;
        default:
            break;
    }
});

// keep last "MAX_HISTORY_LENGTH" tabs in a store
chrome.tabs.onActivated.addListener(async ({tabId}) => {
    const tabList = await readTabsStore();

    tabList.unshift(tabId);

    if (tabList.length > MAX_HISTORY_LENGTH) {
        tabList.length = MAX_HISTORY_LENGTH;
    }

    await saveTabStore(tabList);
});
