import React from 'react';
import Layout from '../../../components/Layout';
import CourseForm from '../../../components/CourseForm';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { safeProps, serializeDbRows } from '../../../lib/serializer';

const NewCoursePage = ({ user, allUsers }) => {
    return (
        <Layout user={user}>
            <h1><i className="fas fa-plus-circle fa-fw"></i> إنشاء دورة جديدة</h1>
            <CourseForm allUsers={allUsers} />
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    // Using shared pool from lib/db.js
    const usersResult = await pool.query("SELECT id, full_name, role FROM users WHERE role = 'teacher'");
    return {
        props: safeProps({
            user: context.user,
            allUsers: serializeDbRows(usersResult.rows),
        })
    };
}, { roles: ['admin', 'head'] });

export default NewCoursePage;
