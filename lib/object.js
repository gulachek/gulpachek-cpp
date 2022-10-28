const { Target } = require('gulpachek');
const { CppDepfile } = require('./depfile');

class CppObject extends Target {
	#src;
	#includes;
	#depfile;
	#cpp;
	#defs;

	constructor(cpp, args) {
		const sys = cpp.sys();
		const src = sys.src(args.src);

		const params = { defs: [] };
		for (const kvp of args.defs) {
			params.defs.push(kvp);
		}
		params.includes = args.includes.map(i => i.abs);
		
		super(sys, src.path.gen({
			namespace: 'com.gulachek.cpp',
			ext: cpp.toolchain().objectExt
		}));

		this.#src = src;
		this.#includes = args.includes;
		this.#cpp = cpp;
		this.#defs = args.defs;

		this.#depfile = new CppDepfile(cpp, {
			path: src.path.gen({
				namespace: 'com.gulachek.cpp',
				ext: 'd'
			}),
		});
	}

	deps() {
		return [this.#src, ...this.#includes, this.#depfile];
	}

	params() {
		return {
			cppVersion: this.#cpp.cppVersion(),
			isDebug: this.sys.isDebugBuild(),
			definitions: [...this.#defs]
		};
	}

	recipe(cb) {
		console.log(`compiling ${this.path}`);
		const toolchain = this.#cpp.toolchain();

		const args = {
			gulpCallback: cb,
			cppVersion: this.#cpp.cppVersion(),
			depfilePath: this.#depfile.abs,
			outputPath: this.abs,
			srcPath: this.#src.abs,
			isDebug: this.sys.isDebugBuild(),
			includes: this.#includes.map(i => i.abs),
			definitions: this.#defs
		};

		return toolchain.compile(args);
	}
}

module.exports = { CppObject };
