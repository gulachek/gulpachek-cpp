#include "foo.hpp"
#include <iostream>

int main()
{
	auto err = fun<3>();
	std::cout << "success" << std::endl;
	return 0;
}
