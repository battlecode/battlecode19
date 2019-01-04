if [ "$1" == "deploy" ]
then
	npm run build
	cd build
	gsutil -m cp -r * gs://battleserve/dash
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battleserve/**
	mkdir dash
	touch dash/index.html
	gsutil -m cp -r dash gs://battleserve
	rm -rf dash
else
	echo "Unsupported instruction"
fi