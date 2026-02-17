import { app } from "/scripts/app.js";

const VISUAL_SEP = "\u29F5";

app.registerExtension({
    name: "SimpleUtils.DynamicLora",
    async nodeCreated(node, app) {
        if (node.comfyClass === "DynamicFolderLoraSelector") {
            setupFolderFilter(node);
        }
    }
});

function setupFolderFilter(node) {
    if (node.widgets.find(w => w.name === "Folder")) return;

    const loraWidget = node.widgets.find(w => w.name === "lora_name");
    if (!loraWidget) return;

    // マスターデータの初期化
    if (!node._original_loras) {
        node._original_loras = [...loraWidget.options.values];
    }

    // -----------------------------------------------------------
    // 1. フォルダ一覧抽出関数
    // -----------------------------------------------------------
    const getFolders = (sourceList) => {
        const folders = new Set();
        folders.add("All");
        folders.add("Root");

        sourceList.forEach(path => {
            if (path.includes(VISUAL_SEP)) {
                const dirRaw = path.substring(0, path.lastIndexOf(VISUAL_SEP));
                const dirDisplay = dirRaw.replace(new RegExp(VISUAL_SEP, "g"), "/");
                folders.add(dirDisplay);
            }
        });
        return Array.from(folders).sort();
    };

    // 初期フォルダリスト
    let sortedFolders = getFolders(node._original_loras);

    // -----------------------------------------------------------
    // 2. フィルタリング処理
    // -----------------------------------------------------------
    // 無限ループ防止用のフラグ
    let isInternalUpdate = false;

    const updateLoraList = (folderName) => {
        // フラグを立てて「これは自分たちの更新だよ」と知らせる
        isInternalUpdate = true;

        let filteredList;
        const targetPrefix = (folderName === "All" || folderName === "Root")
            ? ""
            : folderName.replace(/\//g, VISUAL_SEP) + VISUAL_SEP;

        if (folderName === "All") {
            filteredList = [...node._original_loras];
        } else if (folderName === "Root") {
            filteredList = node._original_loras.filter(p => !p.includes(VISUAL_SEP));
        } else {
            filteredList = node._original_loras.filter(p => p.startsWith(targetPrefix));
        }

        // ここで値をセットするが、Setter Hookにより「内部更新」としてスルーされる
        loraWidget.options.values = filteredList;

        // 値の維持・リセット
        const currentVal = loraWidget.value || "";
        if (filteredList.length > 0 && !filteredList.includes(currentVal)) {
            loraWidget.value = filteredList[0];
        } else if (filteredList.length === 0) {
            loraWidget.value = "";
        }

        node.setDirtyCanvas(true, true);

        // 処理が終わったらフラグを下ろす
        isInternalUpdate = false;
    };

    // -----------------------------------------------------------
    // 3. ウィジェット作成
    // -----------------------------------------------------------
    const folderWidget = node.addWidget(
        "combo", "Folder", "All",
        (selectedFolder) => { updateLoraList(selectedFolder); },
        { values: sortedFolders }
    );

    const fIdx = node.widgets.indexOf(folderWidget);
    node.widgets.splice(fIdx, 1);
    node.widgets.unshift(folderWidget);

    // -----------------------------------------------------------
    // 4. データ更新の待ち伏せ (Setter Hook)
    // -----------------------------------------------------------
    // loraWidget.options.values への書き込みを監視・横取りする

    // 現在の値をバックアップ
    let _internalValues = loraWidget.options.values;

    Object.defineProperty(loraWidget.options, "values", {
        // 誰かが値を読もうとしたら、現在の（フィルタ済みの）値を返す
        get() {
            return _internalValues;
        },
        // 誰かが値を書き込もうとしたら...
        set(newValues) {
            // 私たちのフィルタ処理による書き込みなら、そのまま通す
            if (isInternalUpdate) {
                _internalValues = newValues;
                return;
            }

            // ComfyUI本体(Refresh)からの書き込みなら、それを「新しいマスターデータ」として保存
            // (UIには渡さない)
            node._original_loras = [...newValues];

            // 新しいデータに基づいてフォルダリストも更新
            sortedFolders = getFolders(node._original_loras);
            folderWidget.options.values = sortedFolders;

            // 即座にフィルタを適用し直す
            // これにより、UI上は一瞬たりとも「全件データ」にはならない
            updateLoraList(folderWidget.value);
        },
        configurable: true,
        enumerable: true
    });

    // -----------------------------------------------------------
    // 5. 設定保存・復元
    // -----------------------------------------------------------
    const originalOnConfigure = node.onConfigure;
    node.onConfigure = function (w) {
        if (originalOnConfigure) originalOnConfigure.apply(this, arguments);

        const loadedFolder = folderWidget.value;
        const loadedLora = loraWidget.value;

        if (loadedFolder && sortedFolders.includes(loadedFolder)) {
            updateLoraList(loadedFolder);
            if (loadedLora) loraWidget.value = loadedLora;
        } else {
            if (loadedLora && loadedLora.includes(VISUAL_SEP)) {
                const dirRaw = loadedLora.substring(0, loadedLora.lastIndexOf(VISUAL_SEP));
                const dirDisplay = dirRaw.replace(new RegExp(VISUAL_SEP, "g"), "/");

                if (sortedFolders.includes(dirDisplay)) {
                    folderWidget.value = dirDisplay;
                    updateLoraList(dirDisplay);
                    loraWidget.value = loadedLora;
                }
            } else {
                folderWidget.value = "All";
                updateLoraList("All");
            }
        }
    };

    // 初期化トリガー
    setTimeout(() => {
        if (loraWidget.value && loraWidget.value.includes(VISUAL_SEP)) {
            const dirRaw = loraWidget.value.substring(0, loraWidget.value.lastIndexOf(VISUAL_SEP));
            const dirDisplay = dirRaw.replace(new RegExp(VISUAL_SEP, "g"), "/");

            if (folderWidget.value !== dirDisplay && sortedFolders.includes(dirDisplay)) {
                folderWidget.value = dirDisplay;
                updateLoraList(dirDisplay);
                loraWidget.value = loraWidget.value;
            }
        }
    }, 100);
}