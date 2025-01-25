# Transmission RPC Client

A TypeScript client for interacting with the Transmission RPC API. This library provides a clean, type-safe interface to manage torrents, query session information, and perform other operations supported by the Transmission daemon.

## Features

- **Type-Safe**: Built with TypeScript, providing full type safety and IntelliSense support.
- **Comprehensive**: Supports all major Transmission RPC methods.
- **Immutable by Default**: Uses `ReadonlyArray` and immutable patterns to prevent accidental mutations.
- **Modern**: Leverages modern JavaScript features like `fetch` and `AbortSignal`.

## Installation

Install the library using npm or yarn:

```bash
npx jsr add @brielov/transmission-rpc
bunx jsr add @brielov/transmission-rpc
deno add jsr:@brielov/transmission-rpc
```

## Usage

### Basic Setup

```typescript
import { TransmissionClient } from "@brielov/transmission-rpc";

const client = new TransmissionClient("http://localhost:9091", {
  username: "your-username",
  password: "your-password",
});
```

### Example: Adding a Torrent

```typescript
const magnetLink = "magnet:?xt=urn:btih:EXAMPLE_HASH&dn=Example+Torrent";

const response = await client.add({
  filename: magnetLink,
  downloadDir: "/downloads/movies",
  paused: false,
});

console.log("Added torrent with ID:", response.torrentAdded.id);
```

### Example: Listing Torrents

```typescript
const torrents = await client.get({
  fields: ["id", "name", "percentDone", "status"],
});

console.log("Torrents:", torrents.torrents);
```

### Example: Removing a Torrent

```typescript
await client.remove(1, true); // Remove torrent with ID 1 and delete its data
```

### Example: Getting Session Stats

```typescript
const stats = await client.stats();
console.log("Download speed:", stats.downloadSpeed);
console.log("Upload speed:", stats.uploadSpeed);
```

## API Documentation

### `TransmissionClient`

#### Constructor

```typescript
new TransmissionClient(baseUrl: string, credentials?: Credentials)
```

- `baseUrl`: The base URL of the Transmission RPC server (e.g., `http://localhost:9091`).
- `credentials`: Optional credentials for authentication (`{ username: string, password: string }`).

#### Methods

- **`session()`**: Retrieves session statistics and settings.
- **`get(args?: GetTorrentArgs<K>)`**: Retrieves information about one or more torrents.
- **`add(args: AddTorrentArgs)`**: Adds a new torrent to the session.
- **`remove(ids: ID, deleteLocalData?: boolean)`**: Removes one or more torrents.
- **`move(id: ID, location: string, move?: boolean)`**: Moves a torrent to a new location.
- **`start(id: ID)`**: Starts one or more torrents.
- **`stop(id: ID)`**: Stops one or more torrents.
- **`startNow(id: ID)`**: Starts one or more torrents immediately, bypassing the queue.
- **`verify(id: ID)`**: Verifies the data of one or more torrents.
- **`reannounce(id: ID)`**: Reannounces one or more torrents to their trackers.
- **`moveUp(id: ID)`**: Moves one or more torrents up in the queue.
- **`moveDown(id: ID)`**: Moves one or more torrents down in the queue.
- **`moveTop(id: ID)`**: Moves one or more torrents to the top of the queue.
- **`moveBottom(id: ID)`**: Moves one or more torrents to the bottom of the queue.
- **`freeSpace(path: string)`**: Retrieves the amount of free space in a directory.
- **`set(args: TorrentSetArgs)`**: Sets properties for one or more torrents.
- **`stats()`**: Retrieves session statistics.
- **`closeSession()`**: Closes the Transmission session.
- **`testPort()`**: Tests whether the incoming peer port is accessible.
- **`updateBlocklist()`**: Updates the blocklist (if enabled).
- **`renamePath(id: ID, path: string, name: string)`**: Renames a file or directory within a torrent.

### Types

The library includes a variety of TypeScript interfaces and types for type safety. Key types include:

- **`Torrent`**: Represents a torrent and its associated metadata and statistics.
- **`GetTorrentArgs<K>`**: Arguments for fetching torrents with specific fields.
- **`AddTorrentArgs`**: Arguments for adding a new torrent.
- **`TorrentSetArgs`**: Arguments for modifying torrent properties.
- **`SessionStatsResponse`**: Response from the `session-stats` method.
- **`PortTestResponse`**: Response from the `port-test` method.

For detailed type definitions, refer to the source code or TypeScript IntelliSense.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, improvements, or new features.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
