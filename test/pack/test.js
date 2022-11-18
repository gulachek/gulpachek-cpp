const { Command } = require('commander');
const { CppBuildCommand } = require('gulpachek-cpp');
const { copyFile } = require('gulpachek');

const program = new Command();

const cppBuild = new CppBuildCommand({
	program,
	cppVersion: 20
});

cppBuild.on('configure', (cmd) => {
	cmd.option('--always-specify-pack <foo>', 'always specify this in pack');
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

	if (args.opts.alwaysSpecifyPack !== 'foo')
		throw new Error('--always-specify-pack not present');

	addTarget(copyFile(sys.src('src/foo.cpp'), 'foo.cpp'));

	return foo(args);
});

const test = program.command('test');

cppBuild.configure(test, (args) => {
	const { cpp } = args;
	const foo = cpp.require('com.example.foo', '0.1.0');

	const hello = cpp.compile({
		name: 'hello',
		src: [ 'src/hello.cpp' ]
	});

	hello.link(foo);

	return hello.executable();
});

program.parse();
