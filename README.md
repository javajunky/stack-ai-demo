# Stack AI File Picker Demo

A custom File Picker implementation for Google Drive Connection.

## Prerequisites

- Node.js (v18 or higher)
- pnpm

## Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Copy the environment variables:

```bash
cp .env.sample .env
```

4. Update the `.env` file with your credentials:
- Supabase authentication details
- Stack AI API credentials
- Stack AI account email and password

## Running the Project

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Features

- Browse Google Drive files and folders
- Select and index files
- Sort and filter capabilities
- File status tracking
