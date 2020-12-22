# Geo Web Project on xDai

This branch modifies the core contracts of the Geo Web Project to work best with stablechains like xDai.

See the live alpha at https://xdai-geo-web-cadastre.on.fleek.co/

## Background

The [Geo Web Project](http://geoweb.network) is a set of open protocols and system of property rights for anchoring digital content to physical land. We launched our MVP on the Kovan testnet a few weeks ago. We are still in heavy experimentation mode and exploring different options to improve the user experience, performance, and cost for users. xDai has been of particular interest due to the potential user experience improvement from being a stablechain as well as speed and cost improvements. Our bounty submission will be forking our current MVP on Kovan to run on xDai.

Changes include:

- Changing all economics to use the native gas token instead of an ERC20 token
- Simplifying and experimenting with the user interface to improve the experience around faucets, remove the extra ERC20 approval step, and better communicate prices relative to USD

## Cadastre UI

The Cadastre UI has also been updated with a new user experience designed around a stablechain like xDai. See the branch [here](https://github.com/Geo-Web-Project/cadastre/tree/xdai).

## Learnings

Some key takeaways from redesigning the user experience around xDai:

- Using the same currency for gas and purchasing land is a much simpler user experience
- Having a stablecoin be the payment token simplifies pricing and makes it easier to understand the values of land
- Faster transaction time makes the overall user experience much smoother
