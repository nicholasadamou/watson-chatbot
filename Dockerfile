FROM node:latest

LABEL solution="nicholasadamou"
LABEL component="watson-chatbot"

USER root
RUN apt install -y bash git g++

# See best practices on how to run node applications in Docker here:
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
#
WORKDIR /opt/app
RUN chown node /opt/app

RUN rm -rf server/ui/*
RUN mkdir -p server/videos
RUN chown node server/videos

COPY --chown=node angular-app /opt/app/angular-app
COPY --chown=node server /opt/app/server

# We copy the package.json to leverage the layer caching
# capabilities of Docker. If the package.json is not
# changed, the build process will not run the npm install
# command, which is the next command in the Dockerfile.
#
# The rationale behind this is the following: if the package.json
# is not changed, Docker will use the previously cached layer
# (outcome of previous image builds). When it comes to execute
# the next instruction, which is unchanged it will be able to
# reuse a previously cached layer associated to the instruction
# "RUN npm install" which has not changed.
#
# If the package.json has not changed, the previous layer has
# not changed, so this layer is not changed either and the
# command will not be re-executed but the associated layer
# will be added to the image.
#
# NOTE: this optimisation ONLY WORKS if we used fixed versions
#       of the packages in the package.json and we do not have
#       any wildcards, which would make npm lookup for new and
#       updated versions. In this case the updates would not
#       be pulled in because the cached layer has been re-used.
#       This should not be a problem for a production deployment
#       where we should always fix versions.
#
COPY --chown=node ./package.json /opt/app/package.json
COPY --chown=node ./angular-app/package.json /opt/app/angular-app/package.json

RUN yarn install-dependencies

WORKDIR /opt/app/angular-app
RUN node_modules/@angular/cli/bin/ng build
RUN cp -a dist/angular-app/. /opt/app/server/ui/

# We copy the rest of the application, this will override the
# previously copied files, but they're the same so we don't
# bother.
#
ARG PROP
LABEL PROP=${PROP}

WORKDIR /opt/app

USER node

# This is to prevent that the command gets overridden from
# outside.
#
ENTRYPOINT ["npm"]

# This is to specify which command to run with NPM.
#
CMD ["run", "start"]

# We move this at the end of the Dockkuberfile because the
# commit will be different at every build (most likely)
# and this will invalidate any layer caching we can do
# if we do not change the package.json.
#
ARG COMMIT
LABEL commit=${COMMIT}
