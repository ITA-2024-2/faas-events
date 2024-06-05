'use strict';

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

module.exports.createExam = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  let data;

  try {
    data = JSON.parse(event.body);
    console.log("Parsed data:", data);
  } catch (error) {
    console.error("Error parsing event body:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body', details: error.message }),
    };
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
    return {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
  } catch (error) {
    console.error("Error creating exam:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create exam', details: error.message }),
    };
  }
};

module.exports.getAllExams = async () => {
  const params = {
    TableName: 'Exams',
  };

  console.log("DynamoDB scan params:", params);

  try {
    const result = await dynamoDb.scan(params).promise();
    console.log("Exams retrieved successfully:", result.Items);
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error("Error retrieving exams:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve exams', details: error.message }),
    };
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
    const result = await dynamoDb.get(params).promise();
    if (result.Item) {
      console.log("Exam retrieved successfully:", result.Item);
      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    } else {
      console.log("Exam not found with ID:", event.pathParameters.id);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Exam not found' }),
      };
    }
  } catch (error) {
    console.error("Error retrieving exam:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve exam', details: error.message }),
    };
  }
};

module.exports.updateExam = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  let data;

  try {
    data = JSON.parse(event.body);
    console.log("Parsed data:", data);
  } catch (error) {
    console.error("Error parsing event body:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body', details: error.message }),
    };
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
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error("Error updating exam:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not update exam', details: error.message }),
    };
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
    await dynamoDb.delete(params).promise();
    console.log("Exam deleted successfully with ID:", event.pathParameters.id);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Exam deleted' }),
    };
  } catch (error) {
    console.error("Error deleting exam:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not delete exam', details: error.message }),
    };
  }
};
