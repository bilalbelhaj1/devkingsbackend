const Resource = require('../models/Resource');

const createOrUpdateResources = async (resources) => {
  const parsedResources = typeof resources === 'string' ? JSON.parse(resources) : resources;
  if (!Array.isArray(parsedResources) || parsedResources.length === 0) {
    return [];
  }

  const resourceIds = [];

  for (const res of parsedResources) {
    if (res._id) {
      // Update existing resource by _id
      const updated = await Resource.findByIdAndUpdate(res._id, res, { new: true });
      if (updated) {
        resourceIds.push(updated._id);
      }
    } else {
      // Create new resource
      const created = new Resource(res);
      const saved = await created.save();
      resourceIds.push(saved._id);
    }
  }

  return resourceIds;
};

module.exports = createOrUpdateResources;
