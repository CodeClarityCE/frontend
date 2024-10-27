branch_tag=$(git tag --contains)
package_version="v$1"

if [ "$branch_tag" = "$package_version" ];
then echo "Same version";
else echo "Not same version : $branch_tag != $package_version" && exit 1 ;
fi