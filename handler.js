'use strict';

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_secret_key';

const authenticate = (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error('Unauthorized');
  }
};

const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
};

module.exports.createExam = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  let data;

  try {
    authenticate(event);
    data = JSON.parse(event.body);
    console.log("Parsed data:", data);
  } catch (error) {
    console.error("Error parsing event body or unauthorized:", error);
    return createResponse(400, { error: 'Invalid request body or unauthorized', details: error.message });
  }

  const params = {
    TableName: 'Exams',
    Item: {
      id: uuidv4(),
      examSubject: data.examSubject,
      examDate: data.examDate,
      professor: data.professor,
      assistant: data.assistant,
      numberOfStudents: data.numberOfStudents,
      examLocation: data.examLocation,
      examClass: data.examClass
    }
  };

  console.log("DynamoDB put params:", params);

  try {
    await dynamoDb.put(params).promise();
    console.log("Exam created successfully:", params.Item);
    return createResponse(200, params.Item);
  } catch (error) {
    console.error("Error creating exam:", error);
    return createResponse(500, { error: 'Could not create exam', details: error.message });
  }
};

module.exports.getAllExams = async (event) => {
  const params = {
    TableName: 'Exams',
  };

  console.log("DynamoDB scan params:", params);

  try {
    authenticate(event);
    const result = await dynamoDb.scan(params).promise();
    console.log("Exams retrieved successfully:", result.Items);
    return createResponse(200, result.Items);
  } catch (error) {
    console.error("Error retrieving exams or unauthorized:", error);
    return createResponse(500, { error: 'Could not retrieve exams or unauthorized', details: error.message });
  }
};

module.exports.getExam = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const params = {
    TableName: 'Exams',
    Key: {
      id: event.pathParameters.id,
    },
  };

  console.log("DynamoDB get params:", params);

  try {
    authenticate(event);
    const result = await dynamoDb.get(params).promise();
    if (result.Item) {
      console.log("Exam retrieved successfully:", result.Item);
      return createResponse(200, result.Item);
    } else {
      console.log("Exam not found with ID:", event.pathParameters.id);
      return createResponse(404, { error: 'Exam not found' });
    }
  } catch (error) {
    console.error("Error retrieving exam or unauthorized:", error);
    return createResponse(500, { error: 'Could not retrieve exam or unauthorized', details: error.message });
  }
};

module.exports.updateExam = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  let data;

  try {
    authenticate(event);
    data = JSON.parse(event.body);
    console.log("Parsed data:", data);
  } catch (error) {
    console.error("Error parsing event body or unauthorized:", error);
    return createResponse(400, { error: 'Invalid request body or unauthorized', details: error.message });
  }

  const params = {
    TableName: 'Exams',
    Key: {
      id: event.pathParameters.id,
    },
    UpdateExpression: 'set examSubject = :examSubject, examDate = :examDate, professor = :professor, assistant = :assistant, numberOfStudents = :numberOfStudents, examLocation = :examLocation, examClass = :examClass',
    ExpressionAttributeValues: {
      ':examSubject': data.examSubject,
      ':examDate': data.examDate,
      ':professor': data.professor,
      ':assistant': data.assistant,
      ':numberOfStudents': data.numberOfStudents,
      ':examLocation': data.examLocation,
      ':examClass': data.examClass,
    },
    ReturnValues: 'UPDATED_NEW',
  };

  console.log("DynamoDB update params:", params);

  try {
    const result = await dynamoDb.update(params).promise();
    console.log("Exam updated successfully:", result.Attributes);
    return createResponse(200, result.Attributes);
  } catch (error) {
    console.error("Error updating exam:", error);
    return createResponse(500, { error: 'Could not update exam', details: error.message });
  }
};

module.exports.deleteExam = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const params = {
    TableName: 'Exams',
    Key: {
      id: event.pathParameters.id,
    },
  };

  console.log("DynamoDB delete params:", params);

  try {
    authenticate(event);
    await dynamoDb.delete(params).promise();
    console.log("Exam deleted successfully with ID:", event.pathParameters.id);
    return createResponse(200, { message: 'Exam deleted' });
  } catch (error) {
    console.error("Error deleting exam or unauthorized:", error);
    return createResponse(500, { error: 'Could not delete exam or unauthorized', details: error.message });
  }
};

module.exports.databaseTrigger = async (event) => {
  console.log('Database Trigger Event:', JSON.stringify(event, null, 2));
  for (const record of event.Records) {
    console.log('DynamoDB Record:', JSON.stringify(record, null, 2));
    if (record.eventName === 'INSERT') {
      const newItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      console.log('New item inserted:', newItem);
    } else if (record.eventName === 'MODIFY') {
      const updatedItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      const oldItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
      console.log('Item updated. New:', updatedItem, 'Old:', oldItem);
    } else if (record.eventName === 'REMOVE') {
      const deletedItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
      console.log('Item deleted:', deletedItem);
    }
  }
  return createResponse(200, { message: 'Database trigger executed' });
};

module.exports.fileUpload = async (event) => {
  const bucketName = 'exams-bucket';
  const key = event.queryStringParameters.key;
  const body = event.body;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
  };

  await s3.putObject(params).promise();

  return createResponse(200, { message: 'File uploaded successfully' });
};

module.exports.messageHandler = async (event) => {
  console.log('Message Event:', JSON.stringify(event, null, 2));
  for (const record of event.Records) {
    console.log('SQS Message:', JSON.stringify(record, null, 2));
    const messageBody = JSON.parse(record.body);
    console.log('Message Body:', messageBody);
    if (messageBody.task === 'processData') {
      await processData(messageBody.data);
    } else if (messageBody.task === 'sendNotification') {
      await sendNotification(messageBody.notificationDetails);
    } else {
      console.log('Unknown task:', messageBody.task);
    }
  }
  return createResponse(200, { message: 'Message handled' });
};

const processData = async (data) => {
  console.log('Processing data:', data);
};

const sendNotification = async (notificationDetails) => {
  console.log('Sending notification:', notificationDetails);
};

module.exports.cronJob = async (event) => {
  console.log('Cron Job Event:', JSON.stringify(event, null, 2));
  try {
    await cleanupOldData();
    await sendScheduledNotifications();
    return createResponse(200, { message: 'Cron job executed successfully' });
  } catch (error) {
    console.error('Error executing cron job:', error);
    return createResponse(500, { message: 'Error executing cron job', error: error.message });
  }
};

const cleanupOldData = async () => {
  console.log('Cleaning up old data...');
};

const sendScheduledNotifications = async () => {
  console.log('Sending scheduled notifications...');
};