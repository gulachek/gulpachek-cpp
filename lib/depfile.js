const { Target } = require('gulpachek');
const fs = require('fs');

class CppDepfile extends Target {
	#toolchain;

	constructor(cpp, args) {
		super(cpp.sys(), args.path);
		this.#toolchain = cpp.toolchain();
	}

	build() {
		return Promise.resolve();
	}

	toString() {
		return `CppDepfile{${this.abs}}`;
	}

	mtime() {
		const zero = new Date(0);
		const path = this.abs;
		if (!fs.existsSync(path)) return zero; // nothing to depend on

		let maxAge = zero;
		for (const f of this.#toolchain.depfileEntries(path)) {
			try {
				const age = fs.statSync(f).mtime;
				maxAge = maxAge < age ? age : maxAge;
			} catch (e) {
				e.message += `: ${f}`;
				throw e;
			}
		}

		return maxAge;
	}
}

module.exports = { CppDepfile };
