
## `string64.encode`内で使用しているアルゴリズム
`string64.encode()`内では、差分圧縮と辞書式圧縮を使い分けるようなアルゴリズムを使用しています。<br>
このアルゴリズムは、文字列から1文字を取り出し出力用の文字列に変換する部分と、辞書として機能する配列に文字コードを記録する部分に分かれています。

アルゴリズムの説明に登場する変数の意味は次の通りです。
- `n`
	- 変換元の文字の文字コード。この値は `String.codePointAt()` の戻り値であるため、0以上0x10ffff以下の数値を持ちます。
- `log_all`
	- 値を最大56種類格納する配列です。
- `log_hi`
	- 上位13bitの値を最大56種類格納する配列です。
- `index_all`
	- `log_all.indexOf( n )`の戻り値です。
- `index_hi`
	- `log_hi.indexOf( n )`の戻り値です。


### 文字列の変換処理
文字列から1文字を取り出し、その文字コードからnを決定し、`n`から`index_all`と`index_hi`を決定します。その後、次の規則に従い文字列を生成します。

| 条件式                             | 文字列の生成に使用される値                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `index_all !== -1`                 | `index_all`                                                                                |
| `( n ^ log_all[ 0 ] ) >> 8 === 0`  | `0x38 \| n & 3`,  `n >> 2 & 0x3f`                                                          |
| `index_hi !== -1`                  | `0x3c \| n & 3`,  `n >> 2 & 0x3f`,  `index_hi`                                             |
| `( n ^ log_all[ 0 ] ) >> 16 === 0` | `0x3c \| n & 3`,  `n >> 2 & 0x3f`,  `0x38 \| n >> 8 & 3`, <br> `n >> 10 & 0x3f`            |
|                                    | `0x3c \| n & 3`,  `n >> 2 & 0x3f`,  `0x3c \| n >> 8 & 3`, <br> `n >> 10 & 0x3f`, `n >> 16` |

表の1列目に記載された条件式を上から順に判定し、最初に真となったパターンの2列目の値が連結する文字列の生成に使用されます。4つの条件式の何れも偽である場合、5行目のパターンが使用されます。
2列目は`init.charset`のインデックスであり、左から順に「,」で区切られた値をインデックスとして使用し、対応する`init.charset`の要素を戻り値となる文字列に連結します。


### 文字コードの変換結果の意味
- 1つ目のパターンは、`index_all`の値が文字に変換されます。`string64.decode()`でも`log_all`と同じ配列が作られるため、この値を利用して変換元の文字コードを特定することができます。

- 2つ目のパターンは、`n`の下位8ビット分のデータが2文字に分けて変換されます。
  このとき1文字目に付与される0x38は、上位3ビットが`index_all`の値でないことを意味するためのビットであり、上から4ビット目は上位13ビットが省略されることを意味するビットです。
  また、0x38は56であり、これが`log_all`の要素数が56である理由です。

- 3つ目のパターンは、2つ目のパターンの1文字目に付与される値が0x3cになり、3文字目として`index_hi`の値が文字に変換されます。`string64.decode()`でも`log_hi`と同じ配列が作られるため、この値を利用して変換元の文字コードを特定することができます。

- 4つ目のパターンは、前2文字は3つ目のパターンと同じものが、続く2文字にビット8から15のデータが2文字に分けて変換されます。
  このとき3文字目に付与される0x38は、上位3ビットが`index_hi`の値でないことを意味するためのビットであり、上から4ビット目は上位5ビットが省略されることを意味するビットです。
  `log_hi`の要素数が56である理由は、ここで付与される値が0x38であるためです。

- 5つ目のパターンは、4つ目のパターンの3文字目に付与される値が0x3cになり、5文字目として上位5ビット分のデータが変換されます。
  この段階で21ビット分のデータの変換が完了するため、変換処理を終了します。


### 配列への格納処理
`log_all`には1文字ごとに`n`の値が、`log_hi`には `( n ^ log_all[ 0 ] ) >> 8 !== 0`が真である場合に`n & 0x1fff00`の値が、次の方法で格納されます。
- 配列内に格納する値と同じ値が存在する場合、その値より前にある要素は1つずつ後ろにずれる。
- 存在しない場合、全ての値が1つずつずれる。
- 格納する値を先頭の要素に格納する。


## 直前の文字とのxorを利用したビットの省略の妥当性
文字の変換処理は、「連続する文字の文字コードは上位ビットが一致している可能性が高い」という予想に基づいて作成しています。
この予想の根拠としては、JavaScriptにおける文字コードはUnicodeであり、Unicodeでは基本的に文字種ごとに[コードブロック]( http://www.unicode.org/Public/UNIDATA/Blocks.txt )を割り当てていることが挙げられます。
同じ文字種の文字は連続した文字コードを割り当てられている可能性が高く、単語など同じ文字種が連続して並ぶケースが十分に考えられると判断したため、戻り値となる文字列の生成処理において、変換する文字と直前の文字とのxorの最上位ビットの位置から省略するビット数を決定しています。


## 配列への格納処理の妥当性
配列への格納処理は、頻繁に出現するデータが配列内に残り続け、出現しない状態が続いたデータが配列から取り除かれるような状態を実現するために作成したものです。
出現しない状態が続いたデータが配列から取り除かれることで辞書に相当する配列を固定長にすることができ、これにより以下のようなメリットを得ることが出来ます。
- 変換元の文字列に含まれる文字の種類が、メモリ消費量や辞書の走査の速さに影響を与えなくなります。
- 配列のインデックスの値域も固定されるため、インデックスのデータの表現に必要なビット数も固定することが出来ます。


## 省略するビット数の決定について
直前の文字とのxorを利用したビットの省略の妥当性の項目でも触れている通り、`string64.encode()`では文字の変換に文字コードが使用される場合に、一部のビットの情報を省略して変換することがあります。
現在の処理でビットが省略される場合、上位5ビットまたは上位13ビットが省略されます。
上位5ビットの省略については、変換元の文字列が基本多言語面に存在する文字を多く含む場合など、値がほとんど変化しないケースが考えられるという理由で、省略パターンの1つとしています。
しかし、下位16ビットについては、Unicodeのブロックに大きさが16ビット未満であるものが多く存在するため分割することでビットの省略を期待できるものの、他よりも明らかに優れているといえるような分け方については未発見です。
現在の処理は、この決定のために作成した格納するビット数と変換元の文字列から変換後の文字列の長さのみを求める関数で比較した結果から、最初の2文字に8ビットのデータを格納する場合と9ビットを格納する場合の差が十分に小さいと判断したため、16ビットのデータを8ビットずつに分けて変換しています。


### 下位16ビットの分割方法の決定の意味
下位16ビットをどのように分割するかは、文字コードが文字の変換に利用されるパターンの内、最も少ない文字数に変換されるパターンをどれだけ用意するかということに等しくなります。
例えば、8ビットずつに分割する場合は上位13ビットが、最初の2文字に9ビット、続く2文字に7ビット格納する場合は上位12ビットが直前の文字と共通する場合に、変換元の文字が2文字に変換されます。
2文字に変換されるパターンを増やすためには、最初の2文字に格納するビットの数を増やす必要があります。
しかし、変換後の文字列において2文字分となる12ビットから、文字コード用のビットと上位ビットの省略の有無を示すビットの分を差し引いた残りの分が配列のインデックスのデータかどうかを示すためのビットとなるため、2文字に変換されるパターンを増やすほど1文字に変換されるパターンは減少します。
ただし、最初の2文字に変換されるビット数を増やすことで続く2文字に変換されるビット数が少なくなり、上位13ビットを記録する配列を大きくすることが出来るため、3文字に変換されるパターンは増加します。


### 文字コード用のビット数と配列の大きさの変化

| 文字コード用のビット数 | 配列のインデックスのデータかどうかを判別するためのビット数 | 配列の大きさ |
| :---: | :---: | :---: |
|  5bit |  6bit |    63 |
|  6bit |  5bit |    62 |
|  7bit |  4bit |    60 |
|  8bit |  3bit |    56 |
|  9bit |  2bit |    48 |
| 10bit |  1bit |    32 |
| 11bit |  0bit |     0 |

配列を大きくすることで変換後の文字数が少なくなるかどうかは、増加した部分に格納された要素が使用される頻度に依存するため、変換元の文字列次第と考えられます。


