const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildRegexSearchFilter = (keyword) => {
    const escaped = escapeRegex(keyword);

    return {
        isDeleted: false,
        $or: [
            { name: { $regex: escaped, $options: "i" } },
            { description: { $regex: escaped, $options: "i" } },
            { sku: { $regex: escaped, $options: "i" } },
            { slug: { $regex: escaped, $options: "i" } },
            { tags: { $elemMatch: { $regex: escaped, $options: "i" } } },
            { colors: { $elemMatch: { $regex: escaped, $options: "i" } } },
            { materials: { $elemMatch: { $regex: escaped, $options: "i" } } },
        ],
    };
};
const normalizeModel3DUrl = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
    }

    return value;
};
module.exports = { escapeRegex, buildRegexSearchFilter, normalizeModel3DUrl };
