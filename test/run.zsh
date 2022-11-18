#!/bin/zsh

DIR="${0:h}"

echo "Cleaning build directories..."
rm -rf "$DIR"/*/{build,node_modules,package-lock.json}

for T in "$DIR"/*/make.js
do {
	echo "============================";
	echo "$T"
	echo "============================";
	(cd "${T:h}" && npm i && node make.js test) || exit 1
} done

echo "============================";
echo pack
echo "============================";

(cd test/pack && {
	pwd
	PACK="$PWD/build/com_example_foo.0.1.0"
	npm i
	node test.js pack \
		--target-platform posix \
		--target-include-dir "$PACK/include" \
		--target-lib-dir "$PACK/lib"

	CPP_LIBROOT_PATH="$PACK"
	function t ; { node test.js test "$@" }
	t && ./build/hello.debug
	t --release && ./build/hello
	t --static-link && ./build/hello.debug
	t --release --static-link && ./build/hello
})

echo "============================";
echo devpack
echo "============================";

(cd test/pack && {
	pwd
	PACK="$PWD/build/devpack"
	npm i
	node test.js devpack

	CPP_LIBROOT_PATH="$PACK"
	function t ; { node test.js test "$@" }
	t && ./build/hello.debug
	t --release && ./build/hello
	t --static-link && ./build/hello.debug
	t --release --static-link && ./build/hello
})
