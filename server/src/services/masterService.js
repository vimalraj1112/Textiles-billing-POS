const ApiError = require('../utils/ApiError');

function masterService(Model, options = {}) {
  const { searchFields = ['name'], referenceModel, referenceField = 'category' } = options;

  async function list({ page = 1, limit = 50, search = '', status = '', sortOrder = false }) {
    const query = {};
    if (search) {
      query.$or = searchFields.map((f) => ({ [f]: { $regex: search, $options: 'i' } }));
    }
    if (status) query.status = status;

    const count = await Model.countDocuments(query);
    const sort = sortOrder ? { sortOrder: 1, name: 1 } : { createdAt: -1 };
    const items = await Model.find(query).sort(sort).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));

    return {
      items,
      total: count,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(count / Number(limit)) || 1,
    };
  }

  async function getAll() {
    return Model.find({ status: 'ACTIVE' }).sort({ sortOrder: 1, name: 1 });
  }

  async function getById(id) {
    const doc = await Model.findById(id);
    if (!doc) throw new ApiError(404, 'Record not found');
    return doc;
  }

  async function create(payload) {
    const doc = new Model({ ...payload });
    return doc.save();
  }

  async function update(id, payload) {
    const doc = await getById(id);
    Object.assign(doc, payload);
    return doc.save();
  }

  async function remove(id) {
    const doc = await getById(id);
    if (referenceModel) {
      const used = await referenceModel.countDocuments({ [referenceField]: id });
      if (used > 0) {
        throw new ApiError(
          409,
          `Cannot delete: this record is used by ${used} existing record(s). Deactivate it instead.`
        );
      }
    }
    await doc.deleteOne();
    return doc;
  }

  return { list, getAll, getById, create, update, remove };
}

module.exports = masterService;