class APIFeatures {
  /**
   * @param {mongoose.Query} query - The Mongoose query object (e.g., Project.find())
   * @param {Object} queryString - The Express request query (req.query)
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // 1. Filtering Logic
  filter() {
    // Create a shallow copy of the query object to avoid mutating req.query directly
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    // Remove special API fields from the filter object
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering: replace gte, gt, lte, lt with $gte, $gt, etc.
    // Example: { price: { gte: '500' } } -> { price: { $gte: '500' } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
       /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // Apply the filtered object to the Mongoose query
    this.query = this.query.find(JSON.parse(queryStr));

    return this; // Return this for method chaining
  }

  // 2. Sorting Logic
  sort(defaultSort = '-createdAt') {
    if (this.queryString.sort) {
      // Convert comma-separated string to space-separated for Mnogoose
      // Example: 'price,rating' -> 'price rating'
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by the newest first
      this.query = this.query.sort(defaultSort);
    }
    return this;
  }

  // 3. Field Limiting Logic (Projection)
  limitFields() {
    if (this.queryString.fields) {
      // Select only specified fields
      // Example: 'name,email' -> 'name email'
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Default: exclude the internal Mongoose version key
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 4. Pagination Logic
  paginate(defaultLimit = 20) {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || defaultLimit;
    const skip = (page - 1) * limit;

    // Skip the results from the previous pages and limit to the current page size
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
