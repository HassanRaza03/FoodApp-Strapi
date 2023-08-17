module.exports = {
  routes: [
    {
      method: "POST",
      path: "/user/updatePassword",
      handler: "custom.updatePassword",
      config: {
        policies: [],
      },
    },
    // updateProfileInfo
    {
      method: "POST",
      path: "/user/updateInfo",
      handler: "custom.updateProfileInfo",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/recipes/getRandom",
      handler: "custom.getRandomRecipes",
      config: {
        policies: [],
      },
    },

    {
      method: "GET",
      path: "/recipes/getFilterByIngredients",
      handler: "custom.getRecipes",
      config: {
        policies: [],
      },
    },

    {
      method: "GET",
      path: "/recipes/getUnApproveRecipes",
      handler: "custom.updateAllRecipesToApprove",
      config: {
        policies: [],
      },
    },

    {
      method: "POST",
      path: "/recipes/favourites/spoonacular",
      handler: "custom.getSpoonFavouriteRecipes",
      config: {
        policies: [],
      },
    },

    {
      method: "POST",
      path: "/recipes/favourites/FoodApp",
      handler: "custom.getFoodAppFavouriteRecipes",
      config: {
        policies: [],
      },
    },

    {
      method: "POST",
      path: "/recipes/favourites/edamam",
      handler: "custom.getEdamamFavouriteRecipe",
      config: {
        policies: [],
      },
    },
    // resetUserPassword

    {
      method: "POST",
      path: "/user/password/forgot-password",
      handler: "custom.forgotPassword",
      config: {
        policies: [],
      },
    },

    {
      method: "POST",
      path: "/user/password/reset-password",
      handler: "custom.resetUserPassword",
      config: {
        policies: [],
      },
    },
  ],
};
