interface CreatorCardProps {
  name: string;
  creatorID: string;
}

export default function CreatorCard({ name, creatorID }: CreatorCardProps) {
  return (
    <div style={{
      padding: '20px',
      border: '1px solid #eaeaea',
      marginBottom: '10px',
      background: 'white'
    }}>
      <h3>{name}</h3>
      <p><strong>Creator ID:</strong> {creatorID}</p>
    </div>
  );
}