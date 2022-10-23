#!/bin/zsh

DIR="${0:h}"

echo "Cleaning build directories..."
rm -rf "$DIR"/*/build

for T in "$DIR"/*/make.js
do {
	echo "============================";
	echo "$T"
	echo "============================";
	(cd "${T:h}" && node make.js test) || exit 1
} done
