if [ "$1" == "deploy" ]
then
	gsutil -m cp -r * gs://battlestatic
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battleserve/**
else
	echo "Unsupported instruction"
fi