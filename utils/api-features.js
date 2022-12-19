class APIFeatures {
  constructor(mongooseQuery, parsedQuery) {
    this.mongooseQuery = mongooseQuery;
    this.parsedQuery = parsedQuery;
    console.log({
      mongooseQuery: this.mongooseQuery,
      parsedQuery: this.parsedQuery,
    });
  }

  filter() {
    console.log({ parsedQuery: this.parsedquery });
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    let queryObj = { ...this.parsedQuery };
    excludedFields.forEach((field) => delete queryObj[field]);
    queryObj = JSON.stringify(queryObj).replace(
      /\b(lt|lte|gt|gte)\b/g,
      (match) => `$${match}`
    );
    queryObj = JSON.parse(queryObj);
    console.log({ oldQuery: this.parsedQuery, updatedQueryObj: queryObj });
    this.mongooseQuery.find(queryObj);
    return this;
  }

  sort() {
    if (this.parsedQuery.sort) {
      let sortQuery = this.parsedQuery.sort.split(',').join(' ');
      this.mongooseQuery.sort(sortQuery);
    } else {
      this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  selectFields() {
    if (this.parsedQuery.fields) {
      const responseFields = this.parsedQuery.fields.split(',').join(' ');
      this.mongooseQuery.select(responseFields);
    } else {
      this.mongooseQuery.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.parsedQuery.page * 1 || 1;
    const limit = this.parsedQuery.limit * 1 || 3;
    const skip = (page - 1) * limit;

    this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
