"use strict";
const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const axios = require("axios");
const moment = require("moment");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    // model: strapi.query("user", "users-permissions").model,
    model: strapi.getModel("plugin::users-permissions.user"),
  });

const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";
const EDAMAM_BASE_URL = "https://api.edamam.com/api";

function randomId() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
}

module.exports = {
  async updatePassword(ctx) {
    // const { id } = ctx.state.user;
    const {
      email,
      currentPassword,
      password,
      passwordConfirmation,
      // username,
      // imageId,
    } = ctx.request.body;

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { email },
      });

    if (!email && !password) {
      return ctx.badRequest("noUpdateData");
    }

    if (password && !currentPassword) {
      return ctx.badRequest("currentPassword.isNull");
    }

    if (password && !passwordConfirmation) {
      return ctx.badRequest("passwordConfirmation.isNull");
    }

    if (password && password != passwordConfirmation) {
      return ctx.badRequest("passwordConfirmation.noMatch");
    }

    const validPassword = await strapi.plugins[
      "users-permissions"
    ].services.user.validatePassword(currentPassword, user?.password);

    if (password && !validPassword) {
      return ctx.badRequest("Current password is not valid");
    }

    if (_.has(ctx.request.body, "email") && !email) {
      return ctx.badRequest("email.notNull");
    }

    if (
      _.has(ctx.request.body, "password") &&
      !password &&
      user.provider === "local"
    ) {
      return ctx.badRequest("password must not null");
    }

    let updateData = {
      ...ctx.request.body,
    };

    // if (imageId) {
    //   updateData.image = imageId;
    // }

    if (_.has(ctx.request.body, "password") && password === user.password) {
      delete updateData.password;
    }

    const data = await strapi.plugins[
      ("user", "users-permissions")
    ].services.user.edit(user?.id, updateData);

    return ctx.send(sanitizeUser(data));
  },

  async updateProfileInfo(ctx) {
    try {
      const { email, imageId } = ctx?.request?.body;

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email },
        });

      let updateData = {
        ...ctx.request.body,
      };

      if (imageId) {
        updateData.image = imageId;
      }

      const data = await strapi.plugins[
        ("user", "users-permissions")
      ].services.user.edit(user?.id, updateData);

      return ctx.send(sanitizeUser(data));
    } catch (error) {
      return ctx.badRequest(error);
    }
  },

  async getRandomRecipes() {
    const ctx = strapi.requestContext.get();
    try {
      const query = ctx.query;

      const payload = {};
      if (query?.cuisine) {
        payload["cuisine"] = {
          id: {
            $eq: query?.cuisine,
          },
        };
      }

      if (query?.meal) {
        payload["meal"] = {
          id: {
            $eq: query.meal,
          },
        };
      }

      if (query?.time) {
        const time = query?.time?.split("_");
        payload["cook_time"] = {
          $gte: time[0],
          $lte: time[1],
        };
      }

      if (query?.excludeIngredients) {
        const excludeFilter = query?.excludeIngredients?.split(",");
        payload["ingredients"] = {
          name: {
            $notContain: [...excludeFilter],
          },
        };
      }

      const samples = await strapi.entityService.findMany(
        "api::recipe.recipe",
        {
          filters: {
            isApprove: {
              $eq: true,
            },
            ...payload,
          },
          populate: ["ingredients", "steps", "image"],
        }
      );

      let maxIngredient = [0, 10000];

      if (query?.maxIngredients) {
        maxIngredient = query?.maxIngredients?.split("_");
      }

      const sortedRecipes = [...samples]
        ?.filter(
          (item) =>
            item?.ingredients?.length >= parseInt(maxIngredient[0]) &&
            item?.ingredients?.length <= parseInt(maxIngredient[1])
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);

      return ctx.send(sortedRecipes);
    } catch (error) {
      return ctx.badRequest(error);
    }
  },

  async getRecipes() {
    const ctx = strapi.requestContext.get();
    try {
      const searchList = ctx.query.q?.split(",");

      let finalResult = {};

      let allData = [];

      const query = ctx.query;

      const payload = {};
      if (query?.cuisine) {
        payload["cuisine"] = {
          id: {
            $eq: query?.cuisine,
          },
        };
      }

      if (query?.meal) {
        payload["meal"] = {
          id: {
            $eq: query.meal,
          },
        };
      }

      if (query?.time) {
        const time = query?.time?.split("_");
        payload["cook_time"] = {
          $gte: time[0],
          $lte: time[1],
        };
      }

      if (query?.includeIngredients && query?.excludeIngredients) {
        const excludeFilter = query?.excludeIngredients?.split(",");
        const includeIngredients = query?.includeIngredients?.split(",");
        payload["ingredients"] = {
          name: {
            $notContains: [...excludeFilter],
            $contains: [...includeIngredients],
          },
        };
      } else if (query?.excludeIngredients) {
        const excludeFilter = query?.excludeIngredients?.split(",");
        payload["ingredients"] = {
          name: {
            $notContains: [...excludeFilter],
          },
        };
      } else if (query?.includeIngredients) {
        const includeIngredients = query?.includeIngredients?.split(",");
        payload["ingredients"] = {
          $name: {
            $contains: [...includeIngredients, ...searchList],
          },
        };
      }

      if (searchList?.length > 0) {
        for (let search of searchList) {
          const results = await strapi.entityService.findMany(
            "api::recipe.recipe",
            {
              populate: ["ingredients", "steps", "image"],
              filters: {
                ...payload,
                isApprove: {
                  $eq: true,
                },
                ingredients: {
                  name: {
                    $contains: search?.trim(),
                  },
                  ...payload?.ingredients,
                },
              },
            }
          );

          allData = [...allData, ...results];
        }
      }

      if (allData?.length > 0) {
        for (let data of allData) {
          finalResult[data?.id] = {
            ...data,
          };
        }
      }

      let maxIngredient = [0, 10000];

      if (query?.maxIngredients) {
        maxIngredient = query?.maxIngredients?.split("_");
      }

      const newResult = Object.values(finalResult)?.filter(
        (item) =>
          item?.ingredients?.length >= parseInt(maxIngredient[0]) &&
          item?.ingredients?.length <= parseInt(maxIngredient[1])
      );

      return ctx.send(newResult);
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async updateAllRecipesToApprove() {
    const ctx = strapi.requestContext.get();

    try {
      const allUnApproveRecipes = await strapi.entityService.findMany(
        "api::ingredient.ingredient",
        {
          filters: {
            isApprove: {
              $eq: true,
            },
          },
        }
      );

      if (allUnApproveRecipes?.length > 0) {
        for (let recipe of allUnApproveRecipes) {
          await strapi.entityService.update(
            "api::ingredient.ingredient",
            recipe.id,
            {
              data: {
                cook_time: 5,
              },
            }
          );
        }
      }

      ctx.send(allUnApproveRecipes);
    } catch (error) {
      console.log(error);
    }
  },

  async getSpoonFavouriteRecipes() {
    const ctx = strapi.requestContext.get();

    try {
      const body = ctx?.request?.body?.data;
      const { spoonacular, edamam, FoodApp } = body;

      const spoonResponse = await axios.get(
        `${SPOONACULAR_BASE_URL}/recipes/informationBulk?apiKey=${
          process.env.SPOONACULAR_API_KEY
        }&ids=${spoonacular?.join(",")}`
      );

      // console.log(spoonResponse?.data);
      return ctx.send(spoonResponse?.data);
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async getFoodAppFavouriteRecipes() {
    const ctx = strapi.requestContext.get();

    try {
      const body = ctx?.request?.body?.data;
      const { FoodApp } = body;

      console.log({ FoodApp });

      if (!FoodApp?.length) {
        ctx.send([]);
      }

      const FoodAppResponse = await strapi.entityService.findMany(
        "api::recipe.recipe",
        {
          filters: {
            id: {
              $in: FoodApp,
            },
          },
          populate: ["ingredients", "steps", "image"],
        }
      );

      // console.log({ FoodAppResponse });

      return ctx.send(FoodAppResponse);
    } catch (error) {
      return ctx.badRequest(console.log(error));
    }
  },

  async getEdamamFavouriteRecipe() {
    const ctx = strapi.requestContext.get();

    try {
      const body = ctx?.request?.body?.data;
      const { edamam } = body;

      console.log({ edamam });

      if (!edamam?.length) {
        ctx.send([]);
        return;
      }

      // 1da60699cf5a613e2ff119d7e5a6e594
      // fd94b7e2
      // "https://api.edamam.com/api/recipes/v2/be3ba087e212f13672b553ecfa876333?type=public&app_id=fd94b7e2&app_key=1da60699cf5a613e2ff119d7e5a6e594"

      const allRecipes = [];
      for (let recipe of edamam) {
        const url = `${EDAMAM_BASE_URL}/recipes/v2/${recipe}?type=public&app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_API_KEY}`;
        console.log(url);
        const response = await axios.get(url);

        console.log(response?.data);
        allRecipes.push(response?.data);
      }

      console.log(allRecipes);
      return ctx.send(allRecipes);
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async forgotPassword() {
    const ctx = strapi.requestContext.get();

    try {
      const body = ctx?.request?.body;

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: body?.email },
        });

      console.log(user);

      if (!user) {
        return ctx.badRequest("User not found.");
      }

      const findVerificationCode = await strapi.entityService.findMany(
        "api::verification-code.verification-code",
        {
          filters: {
            email: {
              $eq: body?.email,
            },
          },
        }
      );

      const code = randomId();

      if (findVerificationCode?.length > 0) {
        const verificationCode = findVerificationCode[0];

        await strapi.entityService.update(
          "api::verification-code.verification-code",
          verificationCode?.id,
          {
            data: {
              code: code,
              isExpired: false,
            },
          }
        );
      } else {
        await strapi.entityService.create(
          "api::verification-code.verification-code",
          {
            data: { email: body?.email, code: code },
          }
        );
      }

      const frontendURL = `${process.env.FRONTEND_URL}/${process.env.RESET_PASSWORD_ROUTE}/${code}`;

      await strapi.plugins["email"].services.email.send({
        to: `${body?.email}`,
        // to: "devnav105@gmail.com",
        from: process.env.FROM_EMAIL,
        subject: "Forgot Password Link From FoodApp",
        html: `<p style={color: "#000"}> Hi @${user?.username}, <br /> <br />

        Forget your password? <br />
        We received a request to reset the password for your account. <br /> <br />

        To reset your password, Click the link below:</p> <br />

        <p> ${frontendURL}</p>


        `,
      });

      return ctx.send({ data: "email sent successfully.", status: true });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async resetUserPassword() {
    // const { id } = ctx.state.user;
    const ctx = strapi.requestContext.get();

    try {
      const { code, email, id, newPassword } = ctx.request.body;
      console.log({ code, email, id, newPassword });

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email },
        });

      if (_.isEmpty(user)) {
        return ctx.badRequest("user does not exist.");
      }

      const getVerificationCode = await strapi.entityService.findOne(
        "api::verification-code.verification-code",
        id
      );

      console.log({ getVerificationCode });

      if (
        email !== getVerificationCode?.email ||
        code !== getVerificationCode?.code
      ) {
        return ctx.badRequest("Invalid token");
      }

      const timeDifference = moment(getVerificationCode?.updatedAt).diff(
        moment(),
        "minutes"
      );

      if (getVerificationCode?.isExpired || timeDifference > 60) {
        return ctx.badRequest("Token is expired.");
      }

      await strapi.entityService.update(
        "api::verification-code.verification-code",
        id,
        {
          data: {
            isExpired: true,
          },
        }
      );

      console.log({ getVerificationCode });

      const data = await strapi.plugins[
        ("user", "users-permissions")
      ].services.user.edit(user?.id, {
        password: newPassword,
      });

      return ctx.send({ data: "Password updated successfully.", status: true });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }

    // return ctx.send(sanitizeUser(data));
  },
};
