"use strict";

/**
 * collection controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::collection.collection",
  ({ strapi }) => ({
    async find(ctx) {
      // some custom logic here
      const { user } = ctx.state;
      console.log("ctx -> ", ctx.params);
      // Calling the default core action
      const { data, meta } = await super.find(ctx);
      const newData = data.filter((item) => {
        const collectionUser = item?.attributes?.user;
        const result = collectionUser?.data?.id === user?.id;
        delete item?.attributes?.user;
        return result;
      });
      console.log("data -> ", newData);
      return { data: newData, meta };
    },

    async findOne(ctx) {
      // some custom logic here
      const { user } = ctx.state;
      console.log("user -> ", user);
      // Calling the default core action
      const { data, meta } = await super.findOne(ctx);
      console.log("data -> ", data);
      let newData = {};
      const collectionUser = data?.attributes?.user;
      if (collectionUser?.data?.id === user?.id) {
        delete data?.attributes?.user;
        return { data, meta };
      } else {
        return ctx.send(
          {
            status: false,
            message: `Collection not found.`,
          },
          404
        );
      }
    },
  })
);
