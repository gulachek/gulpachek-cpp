const { BuildSystem } = require('gulpachek');
const { CppSystem } = require('gulpachek-cpp');
const { spawn } = require('child_process');

const sys = new BuildSystem(__dirname);
const cpp = new CppSystem({sys,
	cppVersion: 20
});

const dep = cpp.compile({
	name: 'com.example.dep',
	version: '0.1.0',
	apiDef: 'DEP_API',
	src: [ 'dep.cpp' ]
});

dep.include('include');

const lib = cpp.compile({
	name: 'com.example.lib',
	version: '0.1.0',
	apiDef: 'LIB_API',
	src: [ 'lib.cpp' ]
});

lib.include('include');
lib.link(dep);

const hello = cpp.compile({
	name: 'hello',
	src: [ 'hello.cpp' ]
});

hello.link(lib);

async function main()
{
	const exe = hello.executable();
	await sys.build(exe);

	spawn(exe.abs, [], { stdio: 'inherit' });
}
main();
