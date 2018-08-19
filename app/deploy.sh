npm run build
cd build
gsutil -m rm gs://battleserve/**
gsutil -m cp -r * gs://battleserve
cd ..