module.exports = function getChunkSize(fileSize) {
    const MB = 1024 * 1024;
    const GB = 1024 * MB;

    if (fileSize <= 100 * MB) {
        return 10 * MB;
    }

    if (fileSize <= 1 * GB) {
        return 16 * MB;
    }

    if (fileSize <= 10 * GB) {
        return 32 * MB;
    }

    return 64 * MB;
}