const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');

const { findToolchain } = require('./findToolchain');
const { Compilation } = require('./compilation');
const { Library } = require('./library');
const { CppLibrootImport, LibrootPackage } = require('./libroot');

const { BuildSystem, Target, Path } = require('gulpachek');

const { Command } = require('commander');

class CppSystem {
	#sys;
	#cppVersion;
	#toolchain;
	#isStaticLink;

	constructor(args) {
		if (!args.sys) {
			throw new Error('sys is required');
		}
		this.#sys = args.sys;

		if (!args.cppVersion) {
			throw new Error('cppVersion is required');
		}
		this.#cppVersion = args.cppVersion;
		this.#toolchain = args.toolchain || findToolchain(os);
		this.#isStaticLink = args.isStaticLink;
	}

	sub(dir) {
		return new CppSystem({
			sys: this.#sys.sub(dir),
			cppVersion: this.#cppVersion,
			toolchain: this.#toolchain,
			isStaticLink: this.#isStaticLink
		});
	}

	sys() { return this.#sys; }
	cppVersion() { return this.#cppVersion; }
	linkType() { return this.#isStaticLink ? 'static' : 'dynamic'; }
	toolchain() { return this.#toolchain; }

	compile(args) {
		return new Compilation(this, args);
	}

	require(name, version, type) {
		type = type || (this.#isStaticLink ? 'static' : 'dynamic');
		return new CppLibrootImport(this, { name, version, type });
	}

	/*
	 * Package library in a build directory
	 *
	 * dir/<libroot>.json
	 * dir/<binary>
	 * dir/<include>
	 */
	pack(lib, args) {
		return new LibrootPackage(this, lib, args);
	}

	toLibrary(obj) {
		if (obj instanceof Library) return obj;

		if (typeof obj.toLibrary === 'function') {
			return obj.toLibrary({ isStaticLink: this.#isStaticLink });
		}

		throw new Error(`${obj} cannot be converted to a Library`);
	}
}

class CppBuildCommand extends EventEmitter
{
	#program;
	#cppVersion;

	constructor(args) {
		super();
		const { program, cppVersion } = args;
		this.#program = program;
		this.#cppVersion = cppVersion;
	}

	#command(name) {
		return this.#program.command(name);
	}

	#configure(args) {
		const { isDebug, isStaticLink } = args;
		const sys = new BuildSystem({ isDebug });
		const cpp = new CppSystem({
			sys,
			isStaticLink,
			cppVersion: this.#cppVersion
		});

		return { sys, cpp };
	}

	configure(command, fTarget) {
		const cmd = command
		.option('--release', 'release build (default debug)')
		.option('--static-link', 'static linkage (default dynamic)')
		.action((opts) => {
			const { sys, cpp } = this.#configure({
				isDebug: !opts.release,
				isStaticLink: opts.staticLink
			});

			const target = fTarget({ sys, cpp, opts });

			return sys.build(target);
		});

		this.emit('configure', cmd);
		return cmd;
	}

	build(fTarget) {
		const command = this.#command('build')
		.description('build binaries');
		return this.configure(command, fTarget);
	}

	pack(fLib) {
		const impl = async (defaults, specifiedOpts) => {

			const tf = [true, false];

			for (const isDebug of tf) {
				for (const isStaticLink of tf) {
					const { sys, cpp } = this.#configure({ isDebug, isStaticLink });
					const opts = {...defaults, ...specifiedOpts};

					const target = new Target(sys);
					const addTarget = target.dependsOn.bind(target);
					const args = { sys, cpp, addTarget, opts };

					const lib = cpp.toLibrary(fLib(args));

					if (opts._useBuildPaths) {
						opts.targetIncludeDir = sys.abs(Path.dest(opts.targetIncludeDir));
						opts.targetLibDir = sys.abs(Path.dest(opts.targetLibDir));
					}

					target.dependsOn(cpp.pack(lib, {
						target: {
							platform: opts.targetPlatform,
							includeDir: opts.targetIncludeDir,
							libDir: opts.targetLibDir
						},
						packageDir: opts.packageDir
					}));

					await sys.build(target);
				}
			}
		};

		const cmd = this.#command('pack')
		.description('package library for target system installation')
		.requiredOption('--target-platform <platform>', 'posix or win32 (for path formats)')
		.requiredOption('--target-include-dir <include>', 'where to install headers on target system')
		.requiredOption('--target-lib-dir <lib>', 'where to install libraries on target system')
		.option('--package-dir <dir>', 'which build directory the package should reside in (default {name}.{version})')
		.action(impl.bind(null, {}));
		this.emit('configure', cmd);

		const devCmd = this.#command('devpack')
			.description('package library for testing locally (in devpack build dir)')
			.action(impl.bind(null, {
			packageDir: 'devpack',
			targetPlatform: os.platform() == 'win32' ? 'win32' : 'posix',
			targetIncludeDir: 'devpack/include',
			targetLibDir: 'devpack/lib',
			_useBuildPaths: true
		}));
		this.emit('configure', devCmd);

		return cmd;
	}
}

module.exports = {
	CppSystem,
	CppBuildCommand
};
