#include "foo.hpp"

#include <boost/filesystem.hpp>

#include <iostream>

void foo(const char *str)
{
	boost::filesystem::path p{str};
	std::cout << p << " exists? " << boost::filesystem::exists(p)
		<< std::endl;
}
