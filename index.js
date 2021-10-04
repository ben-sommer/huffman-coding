const {
    encode: pack,
    decode: unpack
} = require("./msgpack");

const { humanFileSize } = require("./humanFileSize");

const exampleString = "a dead dad ceded a bad babe a beaded abaca bed";

const generateTree = str => {
    let nodes = [];

    [...str].forEach((l) => {
        if (nodes.find((x) => x.t == l)) {
            nodes = [
                ...nodes.filter((x) => x.t != l),
                {
                    t: l,
                    f: nodes.find((x) => x.t == l).f + 1
                },
            ];
        } else {
            nodes.push({
                t: l,
                f: 1
            });
        }
    });

    while (nodes.length > 1) {
        nodes = nodes.sort((a, b) => a.f - b.f);

        nodes = [{
            t: [nodes[0], nodes[1]],
            f: nodes[0].f + nodes[1].f
        }, ...nodes.slice(2)]
    }

    return nodes[0]
}

const treeToArray = (tree) => {
    if (tree.t && tree.t.length > 1) {
        return [treeToArray(tree.t[0]), treeToArray(tree.t[1])]
    } else {
        return tree.t
    }
}

const generateMapBinary = str => {
    return pack(treeToArray(generateTree(str)));
};

const generateMap = tree => {
    let map = {};

    const findPaths = (branch, progress = "") => {
        if (branch.t.length > 1) {
            findPaths(branch.t[0], progress + "0");
            findPaths(branch.t[1], progress + "1");
        } else {
            map[branch.t] = progress
        }
    };

    findPaths(tree);

    return map
}

const encodeString = str => {
    const tree = generateTree(str);
    const map = generateMap(tree);
    const encoded = [...str].map(x => map[x]).join("");

    const bytes = pack({t: tree, m: encoded})

    return bytes
};

const decodeString = (str) => {

    const unpacked = unpack(str);
    const tree = unpacked.t;
    const message = unpacked.m;

    let stringSoFar = "";
    let currentStage = tree;

    [...message].forEach((l) => {
        currentStage = currentStage.t[parseInt(l)];

        if (currentStage.t.length == 1) {
            stringSoFar += currentStage.t[0];
            currentStage = tree;
        }
    });

    return stringSoFar;
};

const encodedString = encodeString(exampleString);
const encodedSize = Math.ceil(encodedString.length / 8);
const normalSize = exampleString.length;

console.log({
    normalMessage: exampleString,
    normalSize: humanFileSize(normalSize),
    encodedMessage: encodedString.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), ''),
    encodedSize: humanFileSize(encodedSize),
    compressionResult: `${Math.floor((encodedSize / normalSize) * 100)}%`
})