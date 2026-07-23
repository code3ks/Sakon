/**
 * Letter templates following Nigerian university formal letter conventions
 * Each template includes proper structure: address block, date, recipient, subject, body, closing
 */

export const letterTemplates = {
  hostel_complaint: `{student_name}
Department of {department}
Ahmadu Bello University, Zaria
{matric_number}

{date}

{recipient_title}
{recipient_office}
Ahmadu Bello University, Zaria

Dear Sir/Madam,

RE: COMPLAINT REGARDING HOSTEL ACCOMMODATION

I am writing to formally lodge a complaint regarding the conditions in my hostel accommodation.

{issue_description}

This situation has been ongoing since {relevant_dates} and has significantly affected my ability to focus on my studies and maintain a conducive living environment.

I respectfully request that {desired_outcome}. I believe this issue requires immediate attention to ensure a safe and comfortable living environment for all students.

I would appreciate your prompt intervention in this matter. I am available to provide any additional information that may be required.

Thank you for your attention to this urgent matter.

Yours faithfully,

{student_name}
{matric_number}
Department of {department}
Level: {level}`,

  exam_deferral: `{student_name}
Department of {department}
Ahmadu Bello University, Zaria
{matric_number}

{date}

{recipient_title}
{recipient_office}
Ahmadu Bello University, Zaria

Dear Sir/Madam,

RE: REQUEST FOR DEFERRAL OF EXAMINATION

I am writing to respectfully request the deferral of my examination(s) for the current academic session.

{issue_description}

This situation arose {relevant_dates} and has made it impossible for me to sit for the examination as scheduled. I have attached supporting documentation to substantiate my request where applicable.

I kindly request that {desired_outcome}. I am committed to taking the examination at the next available opportunity and assure you of my dedication to my academic responsibilities.

I would be grateful for your favorable consideration of this request.

Thank you for your understanding.

Yours faithfully,

{student_name}
{matric_number}
Department of {department}
Level: {level}`,

  bursary_appeal: `{student_name}
Department of {department}
Ahmadu Bello University, Zaria
{matric_number}

{date}

The Bursar
Bursary Department
Ahmadu Bello University, Zaria

Dear Sir/Madam,

RE: APPLICATION FOR FINANCIAL ASSISTANCE

I am writing to humbly appeal for financial assistance with regard to my tuition and related academic expenses.

{issue_description}

This financial difficulty arose {relevant_dates} and has placed considerable strain on my ability to continue my education without interruption.

I respectfully request that {desired_outcome}. I am committed to my studies and have maintained a good academic standing throughout my time at the university.

I have attached relevant supporting documents for your consideration. I would be grateful for any assistance that can be provided to help me continue my education.

Thank you for your consideration of my appeal.

Yours faithfully,

{student_name}
{matric_number}
Department of {department}
Level: {level}`,

  transcript_request: `{student_name}
Department of {department}
Ahmadu Bello University, Zaria
{matric_number}

{date}

The Registrar
Registry Department
Ahmadu Bello University, Zaria

Dear Sir/Madam,

RE: REQUEST FOR OFFICIAL TRANSCRIPT

I am writing to request an official transcript of my academic records at Ahmadu Bello University.

{issue_description}

I completed my studies in the Department of {department} and graduated in {relevant_dates}. I require this transcript for {desired_outcome}.

Please find enclosed:
1. Completed transcript request form
2. Payment receipt for transcript processing
3. Photocopies of relevant identification

I would appreciate it if the transcript could be {desired_outcome}. I am available to collect it in person or can provide a courier address if mailing is required.

Thank you for your assistance in processing this request.

Yours faithfully,

{student_name}
{matric_number}
Department of {department}`,

  registration_issue: `{student_name}
Department of {department}
Ahmadu Bello University, Zaria
{matric_number}

{date}

{recipient_title}
{recipient_office}
Ahmadu Bello University, Zaria

Dear Sir/Madam,

RE: REQUEST FOR ASSISTANCE WITH COURSE REGISTRATION

I am writing to seek your assistance regarding an issue with my course registration for the current academic session.

{issue_description}

This issue arose on {relevant_dates} and has prevented me from completing my registration properly. I have attempted to resolve this through the online portal but have been unsuccessful.

I kindly request that {desired_outcome}. I am concerned about meeting the registration deadline and ensuring my academic progress is not affected.

I am available to visit your office in person or provide any additional information that may be required to resolve this matter.

Thank you for your understanding and assistance.

Yours faithfully,

{student_name}
{matric_number}
Department of {department}
Level: {level}`
};
