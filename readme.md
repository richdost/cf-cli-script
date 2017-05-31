
# Cloud Foundry CLI Scripting

Support scripting in javascript using the [Cloud Foundry CLI](http://docs.cloudfoundry.org/cf-cli/) (which must be installed).


This approach has benefits:

 - You can easily understand things if you are familiar with cf. 
 - cf push is a complex multi-step process that may be hard to exactly duplicate. This approach keeps it aligned because it uses cf push.

Normally I use the REST interfaces for interacting with the cloud now. So this code is a bit unfinished, though it works well enough.

