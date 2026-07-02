const mongoose = require('mongoose');

const reconcileProjectTopicIndexes = async () => {
  const ProjectTopic = require('../models/ProjectTopic');
  const collection = ProjectTopic.collection;
  const indexName = 'periodId_1_groupId_1';
  let indexes = [];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error.codeName !== 'NamespaceNotFound') {
      throw error;
    }
  }
  const groupIndex = indexes.find((index) => index.name === indexName);
  const groupFilter = groupIndex?.partialFilterExpression?.groupId;
  const hasCorrectFilter = groupFilter && groupFilter.$type === 'objectId';

  if (groupIndex && !hasCorrectFilter) {
    try {
      await collection.dropIndex(indexName);
      console.log(`MongoDB index ${indexName} dropped for projecttopics reconciliation.`);
    } catch (error) {
      if (error.codeName !== 'IndexNotFound') {
        throw error;
      }
    }
  }

  if (!groupIndex || !hasCorrectFilter) {
    await collection.createIndex(
      { periodId: 1, groupId: 1 },
      {
        name: indexName,
        unique: true,
        partialFilterExpression: {
          groupId: { $type: 'objectId' },
          isDeleted: false,
          status: { $in: ['submitted', 'ai_checked', 'needs_revision', 'approved', 'assigned', 'locked', 'changed', 'completed'] },
        },
      }
    );
    console.log(`MongoDB index ${indexName} reconciled for projecttopics.`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not defined in .env file.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10, // Up to 10 parallel connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout selection after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`MongoDB Connected successfully to host: ${conn.connection.host}`);
    await reconcileProjectTopicIndexes();
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost! Retrying...');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB Error occurred: ${err.message}`);
});

module.exports = connectDB;
