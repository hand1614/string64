
# string64.jsについて
string64.jsは、任意の文字列から最大64種類の文字で構成される文字列の生成、及び生成した文字列から元の文字列を復元する関数を定義したライブラリです。
筆者はこの機能を、任意の文字列とURLSafeな文字列の可逆変換を行うために作成しました。

## 使用方法

## 関数について
### `string64.encode( str, init = {} )`
__引数__
- `str`
	- 文字列です。
- `init`
	- 戻り値の生成に利用される値を格納したオブジェクトです。以下のプロパティを指定することができます。指定しない場合は既定の値を使用します。
	- `charset`
	    - プロパティ`length`の値が64であり、一意の文字を格納した配列です。関数の戻り値となる文字列は、この配列に存在する文字から構成されます。
	- `log_all`
	    - プロパティ`length`の値が56であり、0以上の整数値のみを格納した配列です。
	- `log_hi`
	    - プロパティ`length`の値が56であり、下位8ビットが0である0以上の整数値のみを格納した配列です。

__戻り値__
- `init.charset`が含む文字によって構成された文字列です。


### `string64.decode( str, init = {} )`
__引数__
- `str`
	- `string64.encode()`の戻り値である文字列です。`init.charset`に存在する文字から構成されます。
- `init`
	- 戻り値の生成に利用される値を格納したオブジェクトです。以下のプロパティを指定することができます。指定しない場合は既定の値を使用します。
	- `charset`
	    - プロパティ`length`の値が64であり、一意の文字を格納した配列です。
	- `log_all`
	    - プロパティ`length`の値が56であり、0以上の整数値のみを格納した配列です。
	- `log_hi`
	    - プロパティ`length`の値が56であり、下位8ビットが0である0以上の整数値のみを格納した配列です。

__戻り値__
- 文字列です。


### 処理内容
string64.jsは、`string64.encode()`で生成した文字列を`string64.decode()`で復元するという利用方法を想定しています。
少なくとも以下の条件を満たす場合、`string64.decode( string64.encode( str, init1 ), init2 ) === str`は`true`となります。
- `n`が0以上63以下の整数の値をとる場合に、`init1.charset[ n ] === init2.charset[ n ]`が常に`true`となる。
- `n`が0以上55以下の整数の値をとる場合に、`init1.log_all[ n ] === init2.log_all[ n ]`が常に`true`となる。
- `n`が0以上55以下の整数の値をとる場合に、`init1.log_hi[ n ] === init2.log_hi[ n ]`が常に`true`となる。

`string64.encode()`及び`string64.decode()`の引数`init`を省略した場合、またはプロパティを指定しない場合、既定の値として以下の値が使用されます。
- `charset`: アルファベットの小文字( 26種類 )、アルファベットの大文字( 26種類 )、数字( 10種類 )、`"-"`、`"_"`を格納した配列。
- `log_all`: 要素数が56であり、全ての要素が0である配列。
- `log_hi` : 要素数が56であり、全ての要素が0である配列。

`string64.encode()`及び`string64.decode()`は、引数`init`で指定した値及び代替として使用する既定の値の浅いコピーを行い、コピーした値を使用します。
また、`compress4()`では生成する文字列が短くなることを意図した処理を行っています。

