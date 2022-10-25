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
