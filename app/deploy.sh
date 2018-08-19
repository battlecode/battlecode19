if [ "$1" == "deploy" ]
then
	npm run build
	cd build
	gsutil -m rm gs://battleserve/**
	gsutil -m cp -r * gs://battleserve
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battleserve/**
	touch index.html
	gsutil cp index.html gs://battleserve
	rm index.html
else
	echo "Unsupported instruction"
fi