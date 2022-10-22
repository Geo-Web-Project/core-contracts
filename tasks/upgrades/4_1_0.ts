/*
	v4.1.0 Upgrade
	
	RegistryDiamond
	===============
	
	Facets to deploy:
	- GeoWebParcelFacetV2
	- PCOLicenseClaimerFacetV2
	
	Function selectors to ADD:
	- getLandParcelV2(uint256) -> GeoWebParcelFacetV2
	- claim(int96,uint256,(uint64,uint256,uint256)) -> PCOLicenseClaimerFacetV2
	
	Function selectors to REMOVE:
	- claim(int96,uint256,uint64,uint256[])
	
	===============
*/
