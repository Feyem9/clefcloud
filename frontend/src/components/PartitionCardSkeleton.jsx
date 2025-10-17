const PartitionCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-hidden">
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-16"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex gap-2 mt-4">
            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-16"></div>
            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
          <div className="flex gap-2">
            <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded-lg w-1/3"></div>
            <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded-lg w-1/3"></div>
            <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded-lg w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartitionCardSkeleton;