const { Command } = require('commander');
const { CppBuildCommand } = require('gulpachek-cpp');
const { spawn } = require('child_process');

const program = new Command();
const cppBuild = new CppBuildCommand({
	program,
	cppVersion: 20
});

function buildFoo(cpp) {
	const boost = {};
	boost.filesystem = cpp.require('org.boost.filesystem', '1.74.0');

	const foo = cpp.compile({
		name: 'com.example.foo',
		version: '0.1.0',
		apiDef: 'FOO_API',
		src: ['src/foo.cpp']
	});

	foo.include('include');
	foo.link(boost.filesystem);

	return foo;
}

function buildExe(args) {
	const { cpp } = args;

	const foo = buildFoo(cpp);

	const hello = cpp.compile({
		name: 'hello',
		src: ['src/hello.cpp']
	});

	hello.link(foo);

	return hello.executable();
}

cppBuild.build(buildExe);

const test = program.command('test')
.description('run hello');

cppBuild.configure(test, async (args) => {
	const { sys } = args;
	const exe = buildExe(args);

	await sys.build(exe);
	return spawn(exe.abs, [], { stdio: 'inherit' });
}
);


program.parse();
