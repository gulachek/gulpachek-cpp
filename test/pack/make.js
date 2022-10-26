const { Command } = require('commander');
const { CppBuildCommand } = require('gulpachek-cpp');
const { copyFile } = require('gulpachek');

const program = new Command();

const cppBuild = new CppBuildCommand({
	program,
	cppVersion: 20
});

function foo(args) {
	const { cpp } = args;

	const lib = cpp.compile({
		name: 'com.example.foo',
		version: '0.1.0',
		src: ['src/foo.cpp'],
		apiDef: 'FOO_API'
	});

	lib.include('include');

	lib.define({
		FOO_DEFAULT_DEFINE: 'default',
		FOO_DEFINE: {
			implementation: 'implementation',
			interface: 'interface'
		}
	});

	return lib;
}

cppBuild.pack((args) => {
	const { sys, addTarget } = args;

	addTarget(copyFile(sys.src('src/foo.cpp'), 'foo.cpp'));

	return foo(args);
});

program.parse(['node', 'script',
	'pack',
	'--target-platform', 'posix',
	'--target-include-dir', '/my/include',
	'--target-lib-dir', '/my/lib'
]);
