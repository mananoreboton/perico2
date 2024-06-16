const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const tar = require('tar');

// List of resources with version, URL, and directory
const resources = [
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx', directory: 'voices' },
  { version: '', url: 'https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3', directory: 'songs' },
  { version: 'arm', url: 'https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_arm64.tar.gz', directory: '' },
  { version: 'x64', url: 'https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_amd64.tar.gz', directory: '' },
  // Add more resources as needed
];

// Function to determine CPU architecture
const getArchitecture = () => {
  const arch = os.arch();
  if (arch === 'x64' || arch === 'x86_64') {
    return 'x64';
  } else if (arch === 'arm' || arch === 'arm64') {
    return 'arm';
  } else {
    throw new Error(`Unsupported architecture: ${arch}`);
  }
};

// Function to download resources based on CPU architecture
const downloadResources = async () => {
  const architecture = getArchitecture();
  console.log(`Detected architecture ${architecture}.`);

  // Filter resources based on architecture and universal ones
  const filteredResources = resources.filter(resource => 
    !resource.version || resource.version === architecture
  );

  // Download filtered resources sequentially
  for (const resource of filteredResources) {
    await downloadResource(resource.url, resource.directory);
  }
};

// Function to download a single resource
const downloadResource = async (url, directory) => {
  const fileName = path.basename(url);
  const downloadDir = path.join(__dirname, 'resources', directory);
  const filePath = path.join(downloadDir, fileName);

  // Check if the file already exists
  if (fs.existsSync(filePath)) {
    console.log(`${fileName} already exists. Skipping download.`);
    return; // Exit early if the file already exists
  }

  // Create download directory if it doesn't exist
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log(`Downloading ${fileName} to ${downloadDir}`);

  try {
    // Use curl with -LJO options to follow redirects and save with original filename
    execSync(`curl -LJO "${url}"`, { cwd: downloadDir });

    console.log(`Downloaded ${fileName} successfully.`);

    // Check if the downloaded file is a .tar.gz
    if (fileName.endsWith('.tar.gz')) {
      await decompressTarGzFile(filePath, downloadDir); // Decompress .tar.gz file
      fs.unlinkSync(filePath); // Delete the compressed file after decompression
    }
  } catch (error) {
    console.error(`Error downloading ${fileName}: ${error.message}`);

    // Clean up if the file was partially downloaded or corrupted
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw error; // Throw the error to propagate it up
  }
};

// Function to decompress .tar.gz files
const decompressTarGzFile = async (filePath, destDir) => {
  console.log(`Decompressing ${filePath} to ${destDir}`);

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(require('zlib').createGunzip()) // Pipe through zlib to gunzip
      .pipe(tar.x({ cwd: destDir })) // Extract using tar, setting cwd to destination directory
      .on('finish', resolve) // Resolve the promise when extraction is complete
      .on('error', reject); // Reject the promise if there's an error
  });
};

if (require.main === module) {
  downloadResources()
    .then(() => {
      console.log('All resources downloaded and processed successfully.');
    })
    .catch((error) => {
      console.error('Failed to download and process resources:', error);
      process.exit(1); // Exit with an error code
    });
}

module.exports = { downloadResources };
