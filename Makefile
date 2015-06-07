SRC_FILES = main.gs

main: ${SRC_FILES}
	valac -o searchbox --pkg gtk+-3.0 --thread ${SRC_FILES}

cgen: ${SRC_FILES}
	valac -C --pkg gtk+-3.0 --thread ${SRC_FILES}
