const { Command } = require('commander');
const { CppBuildCommand } = require('gulpachek-cpp');
const { spawn } = require('child_process');

const program = new Command();
const cppBuild = new CppBuildCommand({
	program,
	cppVersion: 20
});

function makeExe(args)
{
	const { cpp } = args;

	const lib = cpp.compile({
		name: 'com.example.foo',
		version: '0.1.0',
		apiDef: 'FOO_API',
		src: [
			'foo.cpp'
		]
	});

	lib.include('include');

	const test = cpp.compile({
		name: `hello`,
		src: [`hello.cpp`]
	});

	test.link(lib);

	return test.executable();

}

cppBuild.build(makeExe);

const test = program.command('test')
.description('run hello');

cppBuild.configure(test, async (args) => {
	const { sys } = args;
	const exe = makeExe(args);

	await sys.build(exe);

	return spawn(exe.abs, [], { stdio: 'inherit' });
}
);

program.parse();
