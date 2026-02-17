Primitiveノードの不要部分を省いた省スペースノードです<br>
複数ノードに同一パラメータを渡すために作成しました

## 各ノードの解説

* Dynamic LoRA Selector  
    フォルダでフィルタリングし、対象フォルダの中身だけを表示するノード

* Simple Switch (Universal)  
  JPSのLoRAローダーのON/OFFを切り替えるだけのノード

* Simple Sampler / Scheduler Selector  
  Sampler/Scheduler名を渡すだけのノード　Primitiveだと不要な設定箇所が増えるため作成

* Model Sampling Discrete Settings  
  V-predモデルを使用する際に必要な「サンプリング方式」と「ZSNRのON/OFF」を一つのノードから操作するために作成
