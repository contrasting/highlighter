function checkBackup() {
    const backupTimeKey = "lastBackup";

    chrome.storage.sync.get(backupTimeKey, (result) => {
        if (result[backupTimeKey] != null) {
            const lastBackup = new Date(result[backupTimeKey]);
            if (lastBackup.getTime() < new Date().getTime() - 1000 * 60 * 60 * 24) {
                alert("Last backed up more than one day ago")
            }
        } else {
            alert("Last backed up date is null")
        }
    });
}